#!/bin/bash
#
# Integration Test Script for CRM + Multi-Line Dialer
# 
# Prerequisites:
#   - CRM backend running on port 8000
#   - Dialer backend running on port 3001
#   - curl and jq installed
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API endpoints
BASE_CRM="http://localhost:8000"
BASE_DIALER="http://localhost:3001"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_section() {
    echo ""
    echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"
}

# Health check
check_health() {
    log_info "Checking CRM health..."
    if curl -s $BASE_CRM/ > /dev/null; then
        log_success "CRM is running on port 8000"
    else
        log_error "CRM is not responding on port 8000"
        exit 1
    fi

    log_info "Checking Dialer health..."
    if curl -s $BASE_DIALER/ > /dev/null; then
        log_success "Dialer is running on port 3001"
    else
        log_error "Dialer is not responding on port 3001"
        exit 1
    fi
}

# Phase 1: Create leads in CRM
create_leads() {
    log_section "PHASE 1: Creating Leads in CRM"
    
    # Create lead 1
    log_info "Creating lead 1 (Alice - VP Sales)..."
    LEAD1=$(curl -s -X POST $BASE_CRM/leads \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Alice Johnson",
            "job_title": "VP of Sales",
            "phone_number": "555-0101",
            "company": "TechCorp",
            "email": "alice@techcorp.com",
            "headcount": 250,
            "industry": "Technology"
        }' | jq -r '.id // empty')
    
    if [ -n "$LEAD1" ] && [ "$LEAD1" != "null" ]; then
        log_success "Created lead 1 with ID: $LEAD1"
    else
        log_error "Failed to create lead 1"
        return 1
    fi

    # Create lead 2
    log_info "Creating lead 2 (Bob - CTO)..."
    LEAD2=$(curl -s -X POST $BASE_CRM/leads \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Bob Smith",
            "job_title": "CTO",
            "phone_number": "555-0102",
            "company": "HealthInc",
            "email": "bob@healthinc.com",
            "headcount": 150,
            "industry": "Healthcare"
        }' | jq -r '.id // empty')
    
    if [ -n "$LEAD2" ] && [ "$LEAD2" != "null" ]; then
        log_success "Created lead 2 with ID: $LEAD2"
    else
        log_error "Failed to create lead 2"
        return 1
    fi

    # Verify leads exist
    log_info "Verifying leads in CRM..."
    LEAD_COUNT=$(curl -s $BASE_CRM/leads | jq 'length')
    if [ "$LEAD_COUNT" -ge 4 ]; then
        log_success "CRM has $LEAD_COUNT leads (2 seed + 2 new)"
    else
        log_error "Expected at least 4 leads, found $LEAD_COUNT"
        return 1
    fi
}

# Phase 2: Bulk enrich leads
enrich_leads() {
    log_section "PHASE 2: Bulk Enriching Leads"
    
    log_info "Enriching leads $LEAD1 and $LEAD2..."
    ENRICH_RESULT=$(curl -s -X POST $BASE_CRM/leads/bulk-enrich \
        -H "Content-Type: application/json" \
        -d "{\"lead_ids\": [$LEAD1, $LEAD2]}")
    
    ENRICHED_COUNT=$(echo $ENRICH_RESULT | jq '.enriched | length')
    NOT_FOUND_COUNT=$(echo $ENRICH_RESULT | jq '.not_found | length')
    
    if [ "$ENRICHED_COUNT" -eq 2 ]; then
        log_success "Enriched $ENRICHED_COUNT leads"
    else
        log_error "Expected 2 enriched leads, got $ENRICHED_COUNT"
        return 1
    fi
    
    if [ "$NOT_FOUND_COUNT" -eq 0 ]; then
        log_success "No leads reported as not found"
    else
        log_error "Unexpected not_found count: $NOT_FOUND_COUNT"
        return 1
    fi
    
    # Verify is_enriched flag
    log_info "Verifying enrichment flags..."
    LEAD1_ENRICHED=$(curl -s $BASE_CRM/leads | jq ".[] | select(.id == $LEAD1) | .is_enriched")
    if [ "$LEAD1_ENRICHED" = "true" ]; then
        log_success "Lead $LEAD1 is marked as enriched"
    else
        log_error "Lead $LEAD1 is not marked as enriched"
        return 1
    fi
}

# Phase 3: Filter leads by criteria
test_filters() {
    log_section "PHASE 3: Testing CRM Filters"
    
    # Test industry filter
    log_info "Filtering by industry: Technology..."
    TECH_COUNT=$(curl -s "$BASE_CRM/leads?industry=Technology" | jq 'length')
    log_success "Found $TECH_COUNT Technology leads"
    
    # Test headcount range filter
    log_info "Filtering by headcount range: 100-200..."
    RANGE_COUNT=$(curl -s "$BASE_CRM/leads?min_headcount=100&max_headcount=200" | jq 'length')
    log_success "Found $RANGE_COUNT leads with headcount 100-200"
}

# Phase 4: Create dialer session
create_dialer_session() {
    log_section "PHASE 4: Creating Dialer Session"
    
    log_info "Creating session with leads $LEAD1 and $LEAD2..."
    SESSION_DATA=$(curl -s -X POST $BASE_DIALER/sessions \
        -H "Content-Type: application/json" \
        -d "{\"leadIds\": [\"$LEAD1\", \"$LEAD2\"], \"agentId\": \"test-agent\"}")
    
    SESSION_ID=$(echo $SESSION_DATA | jq -r '.id // empty')
    LEAD_QUEUE_COUNT=$(echo $SESSION_DATA | jq '.leadQueue | length')
    
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        log_success "Created session: ${SESSION_ID:0:8}..."
    else
        log_error "Failed to create session"
        return 1
    fi
    
    if [ "$LEAD_QUEUE_COUNT" -eq 2 ]; then
        log_success "Session has $LEAD_QUEUE_COUNT leads in queue"
    else
        log_error "Expected 2 leads in queue, got $LEAD_QUEUE_COUNT"
        return 1
    fi
    
    # Export session ID for next phase
    echo "$SESSION_ID" > /tmp/dialer_session_id
}

# Phase 5: Execute dialing session
execute_dialing() {
    log_section "PHASE 5: Executing Dialing Session"
    
    SESSION_ID=$(cat /tmp/dialer_session_id)
    
    log_info "Starting session ${SESSION_ID:0:8}..."
    START_RESULT=$(curl -s -X POST $BASE_DIALER/sessions/$SESSION_ID/start)
    STATUS=$(echo $START_RESULT | jq -r '.status')
    
    if [ "$STATUS" = "RUNNING" ]; then
        log_success "Session is RUNNING"
    else
        log_error "Expected status RUNNING, got $STATUS"
        return 1
    fi
    
    # Monitor until complete
    log_info "Monitoring calls (max 30 seconds)..."
    for i in {1..10}; do
        sleep 3
        
        SESSION_DATA=$(curl -s $BASE_DIALER/sessions/$SESSION_ID)
        CURRENT_STATUS=$(echo $SESSION_DATA | jq -r '.status')
        METRICS=$(echo $SESSION_DATA | jq -r '[.metrics.attempted, .metrics.connected, .metrics.failed, .metrics.canceled] | @tsv')
        ACTIVE_CALLS=$(echo $SESSION_DATA | jq '.activeCallIds | length')
        
        echo "  [${i}/10] Status: $CURRENT_STATUS | Active: $ACTIVE_CALLS | Metrics (A/C/F/X): $METRICS"
        
        if [ "$CURRENT_STATUS" = "STOPPED" ]; then
            log_success "Session completed!"
            break
        fi
    done
    
    if [ "$CURRENT_STATUS" != "STOPPED" ]; then
        log_error "Session did not complete within expected time"
        return 1
    fi
}

# Phase 6: Verify CRM sync results
verify_crm_sync() {
    log_section "PHASE 6: Verifying CRM Sync"
    
    SESSION_ID=$(cat /tmp/dialer_session_id)
    
    # Check mock CRM activities
    log_info "Checking mock CRM activities..."
    ACTIVITIES=$(curl -s $BASE_DIALER/mock-crm/activities)
    ACTIVITY_COUNT=$(echo $ACTIVITIES | jq 'length')
    
    if [ "$ACTIVITY_COUNT" -ge 2 ]; then
        log_success "Found $ACTIVITY_COUNT CRM activities"
    else
        log_error "Expected at least 2 activities, found $ACTIVITY_COUNT"
        return 1
    fi
    
    # Show activity details
    log_info "Activity summary:"
    echo $ACTIVITIES | jq -r '.[] | "  - Lead \(.leadId): \(.disposition)"'
    
    # Check mock CRM contacts
    log_info "Checking mock CRM contacts..."
    CONTACT_COUNT=$(curl -s $BASE_DIALER/mock-crm/contacts | jq 'length')
    log_success "Found $CONTACT_CONTACT contacts created"
    
    # Get final session metrics
    log_info "Final session metrics:"
    FINAL_DATA=$(curl -s $BASE_DIALER/sessions/$SESSION_ID)
    echo $FINAL_DATA | jq '.metrics'
    
    # Verify call completion
    CALL_COUNT=$(echo $FINAL_DATA | jq '.calls | length')
    if [ "$CALL_COUNT" -eq 2 ]; then
        log_success "All 2 leads were called"
    else
        log_error "Expected 2 calls, found $CALL_COUNT"
        return 1
    fi
}

# Phase 7: Verify call statuses
verify_call_statuses() {
    log_section "PHASE 7: Verifying Call Outcomes"
    
    SESSION_ID=$(cat /tmp/dialer_session_id)
    
    log_info "Call outcomes:"
    curl -s $BASE_DIALER/sessions/$SESSION_ID | jq -r '.calls[] | "  Lead \(.leadId): \(.status) (CRM: \(.crmActivityCreated))"'
    
    # Count by disposition
    CONNECTED_COUNT=$(curl -s $BASE_DIALER/sessions/$SESSION_ID | jq '[.calls[] | select(.status == "CONNECTED")] | length')
    CANCELED_COUNT=$(curl -s $BASE_DIALER/sessions/$SESSION_ID | jq '[.calls[] | select(.status == "CANCELED_BY_DIALER")] | length')
    OTHER_COUNT=$(curl -s $BASE_DIALER/sessions/$SESSION_ID | jq '[.calls[] | select(.status != "CONNECTED" and .status != "CANCELED_BY_DIALER")] | length')
    
    log_success "Disposition summary: $CONNECTED_COUNT connected, $CANCELED_COUNT canceled, $OTHER_COUNT other"
}

# Print summary
print_summary() {
    log_section "TEST SUMMARY"
    
    echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
        rm -f /tmp/dialer_session_id
        exit 0
    else
        echo ""
        echo -e "${RED}══════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  SOME TESTS FAILED!${NC}"
        echo -e "${RED}══════════════════════════════════════════════════════════════${NC}"
        rm -f /tmp/dialer_session_id
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║       INTEGRATION TEST: CRM + Multi-Line Dialer              ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        echo "Error: curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo "Error: jq is required but not installed"
        exit 1
    fi
    
    # Run all phases
    check_health
    create_leads
    enrich_leads
    test_filters
    create_dialer_session
    execute_dialing
    verify_crm_sync
    verify_call_statuses
    
    # Print final summary
    print_summary
}

# Handle interrupts
trap 'echo -e "\n${RED}Test interrupted${NC}"; rm -f /tmp/dialer_session_id; exit 130' INT

# Run main
main
